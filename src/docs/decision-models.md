# Decision models

Decision models take a question and options and return probability for each option, where best option is the answer to the question. These models can answer yes/no questions as well as multi-choice, and there's multimodal (vision language model, Omni model) alternatives. Multimodal ones can even do vision or audio-specific tasks like bounding box detection. You can see below an illustration on how they are separated from LLMs.

<img src="https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/decision-models.png" alt="decision models" />

Decision models are faster than their LLM equivalents returning JSON outputs, because to do classification, decision models do only one forward pass, whereas LLMs do one forward pass and generate many tokens for the JSON output on top of it. Decision models are also more robust as they can only return typed responses.

## Start the server

Install [Llama App](installation). You can get to serve them (on 9931) with a single click. 

<img src="https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/llama-decision-models.png" alt="decision models on llama" />

If you are on Linux you can also run this command in a terminal:

```sh
llama serve -hf Cloudflare/clef-flash
```

Keep the server running. Send requests to `http://localhost:9931/v1/systemone` from a second terminal or your app.

## Recipe: classify a support ticket

This request asks three questions about one ticket. Put the ticket in `state`. Put each task in `questions`.

Here are the field types for different informations you want to get out of the query:

- `noul`: Ask yes/no questions, like "is the customer angry?". Answer is a float ranging from 0 to 1, where closer to 0 is a no, closer to 1 is a yes, and around 0.5 introduces uncertainty.
- `score`: Ask questions on an ordered scale, like "how urgent is the ticket?". Provide levels from lowest to highest in `criteria`. The model returns a score between 0 and the number of levels minus one. For three levels, the score ranges from 0 to 2 and can include decimals, such as 1.7.
- `choice`: Ask questions with multiple choices, provide option descriptions. Model will return the top option and probability for each option.

```sh
curl --fail-with-body http://localhost:9931/v1/systemone \
  -H 'Content-Type: application/json' \
  -d '{
    "state": "The export button fails with error 503. Our report is due in one hour. Please contact me.",
    "questions": {
      "team": {
        "type": "choice",
        "instructions": "Which team should handle this ticket?",
        "criteria": {
          "accounts": "Account details and subscription changes",
          "technical": "Software errors and failed operations",
          "other": "Requests outside these categories"
        }
      },
      "priority": {
        "type": "score",
        "instructions": "How soon does the customer need help?",
        "criteria": ["No deadline", "Within a week", "Within a day", "Within an hour"]
      },
      "contact": {
        "type": "noul",
        "instructions": "Does the customer explicitly ask for contact?"
      }
    }
  }' > decision.json
```

Read the results under `answers`. The question names identify the results.

| Task                   | Type     | Result to use                                                        |
| ---------------------- | -------- | -------------------------------------------------------------------- |
| Route the ticket       | `choice` | `answers.team.choice` contains the selected label.                   |
| Sort the queue         | `score`  | `answers.priority.score` contains a value from 0 to 3.               |
| Flag a contact request | `noul`   | `answers.contact.noul` probability of a yes, 0 to 1, where 1 is yes. |

## Building apps on decision model outputs

Run this Python code beside `decision.json`:

```python
import json

with open("decision.json") as file:
    answers = json.load(file)["answers"]

team = answers["team"]
label = team["choice"]
probability = team["probabilities"][label]

# Setup a fallback threshold for human review
queue = label if probability >= 0.90 else "manual_review"
if label == "other":
    queue = "manual_review"

print("Queue:", queue)
print("Priority score:", answers["priority"]["score"])
print("Contact requested:", answers["contact"]["noul"] >= 0.80)
```

Sort tickets by priority score. The `confidence` field is separate from the selected option's probability. Use one field consistently when you set a threshold.

## Multimodal decision models

You can also ask questions about images and audio. The following examples use [d1 Omni](https://huggingface.co/LiquidAI/d1-Omni-2B-GGUF), which supports both.

```sh
llama serve -hf LiquidAI/d1-Omni-2B-GGUF
```

### Recipe: check a return photo in a shopping app

A customer uploads a photo of a bag with a return request. Use a decision model to check the condition of the product. The app can add this category to the request. If the photo is unclear, it can ask for another photo.

Ask whether the product is in good condition. Use the criteria to distinguish visible damage from an unclear photo. The `images` field contains the image encoded as base64, so it can be sent in JSON. The command below fetches the photo from its URL and converts it to base64 inside the request. You do not need to save the photo first.

```sh
curl --fail-with-body http://localhost:9931/v1/systemone \
  -H 'Content-Type: application/json' \
  --data-binary @- <<JSON
{
  "state": "A customer submitted this product photo with a return request in a shopping app.",
  "images": ["data:image/png;base64,$(curl --fail --silent --show-error --location https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/example-inputs/broken-bag.png | base64 | tr -d '\n')"],
  "questions": {
    "damage": {
      "type": "choice",
      "instructions": "Is this product in good condition?",
      "criteria": {
        "damaged": "No, the product shows visible damage",
        "good_condition": "Yes, the product appears to be in good condition with no visible damage",
        "cannot_assess": "The photo does not show enough detail to assess the condition of the product"
      }
    }
  }
}
JSON
```

The command returns JSON. In our test, the response was:

```json
{
	"model": "LiquidAI/d1-Omni-2B-GGUF:Q8_0",
	"answers": {
		"damage": {
			"type": "choice",
			"choice": "damaged",
			"probabilities": {
				"damaged": 0.9723112262802465,
				"good_condition": 0.019288550574540334,
				"cannot_assess": 0.008400223145213237
			},
			"confidence": 0.9723112262802465
		}
	},
	"usage": {
		"input_tokens": 1623,
		"output_tokens": 0
	}
}
```

Read `answers.damage.choice` for the selected category and `answers.damage.probabilities` for the probability of each category. The bag has torn fabric around the zipper, so the expected category is `damaged`.

Use the selected category in your app:

- `damaged`: mark the return request for damage review.
- `good_condition`: ask the customer to describe the problem. Some faults are not visible in a photo.
- `cannot_assess`: ask for a clearer photo of the affected part.

### Recipe: route a voice report in a maintenance app

A tenant records a message about a problem in their home. Use a decision model to select the team that should handle the request. The app can then send the report to that team.

The command below fetches the recording from its URL and sends it in `files` as a base64 audio data URL. It's a voice recording of a tenant complaining about specifics of a plumbing issue. You do not need to transcribe the recording first as d1-Omni can take audio input directly.

```sh
curl --fail-with-body http://localhost:9931/v1/systemone \
  -H 'Content-Type: application/json' \
  --data-binary @- <<JSON
{
  "state": "A tenant submitted this voice report in a property maintenance app.",
  "files": ["data:audio/wav;base64,$(curl --fail --silent --show-error --location https://huggingface.co/datasets/huggingface/documentation-images/resolve/main/llama.cpp/example-inputs/audio.wav | base64 | tr -d '\n')"],
  "questions": {
    "team": {
      "type": "choice",
      "instructions": "Which maintenance team should handle the problem described by the tenant?",
      "criteria": {
        "plumbing": "Water leaks, blocked drains, taps, toilets, or water supply problems",
        "electrical": "Power supply, lights, sockets, or electrical wiring problems",
        "heating": "Heating, radiators, or temperature control problems",
        "other": "Another type of problem, multiple unrelated problems, or a report that is too unclear to route"
      }
    }
  }
}
JSON
```

The command returns JSON. In our test, the response was:

```json
{
	"model": "LiquidAI/d1-Omni-2B-GGUF:Q8_0",
	"answers": {
		"team": {
			"type": "choice",
			"choice": "plumbing",
			"probabilities": {
				"plumbing": 0.9192943910934662,
				"electrical": 0.012966433041228765,
				"heating": 0.008065308728329928,
				"other": 0.05967386713697512
			},
			"confidence": 0.9192943910934662
		}
	},
	"usage": {
		"input_tokens": 341,
		"output_tokens": 0
	}
}
```

Check out `answers.team.choice` for the selected team, and `answers.team.probabilities` for the probability of each team. The tenant describes a plumbing problem, so the expected category is `plumbing`. Route the report to selected team and send `other` to a property manager for review. Use a fallback threshold to send uncertain results for manual review.

## Use cases

You can use decision models for many other use cases. Here's some inspiration:

- **Content moderation:** use `choice` with your policy categories and a review category. Describe each category in `criteria`.
- **Lead qualification on emails:** use `score` with levels such as no interest, exploring, and ready to buy.

Test clear, ambiguous, and unrelated inputs with known answers. Select thresholds from these results. Repeat the checks when you change the model or criteria.

To learn more about decision models, read [Decision Models in Hugging Face](https://huggingface.co/blog/decision). For more examples, see [Decision Models in llama.cpp](https://huggingface.co/blog/ggml-org/decision-models-in-llamacpp).
