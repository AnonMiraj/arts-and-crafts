
import requests
import csv

ANKI_CONNECT_URL = "http://localhost:8765"
DECK_NAME = "college::cloud"
MODEL_NAME = "Multiple Choice (GitHub Gist)"
TAGS = [""]
CSV_FILENAME = ''
CSV_DELIMITER = '@'
ALLOW_DUPLICATES = False


def format_multiple_choice(multiple_choice):
    choices_list = multiple_choice.split("\n")
    html_choices = "<ul>\n"
    for choice in choices_list:
        html_choices += f"  <li>{choice}</li>\n"
    html_choices += "</ul>"
    return html_choices


def format_question(question):
    return question.replace("\n", "<br>")


def add_cards_from_csv(csv_filename):
    try:
        with open(csv_filename, mode='r', newline='', encoding=utf-8) as file:
            csv_reader = csv.reader(file, delimiter=CSV_DELIMITER)

            next(csv_reader, None)

            for row in csv_reader:
                if len(row) < 3:
                    print(f"Skipping invalid row: {row}")
                    continue

                question = row[0]
                multiple_choice = row[1]
                correct_answer = row[2]

                formatted_question = format_question(question)
                formatted_choices = format_multiple_choice(multiple_choice)

                card_data = {
                    "deckName": DECK_NAME,
                    "modelName": MODEL_NAME,
                    "fields": {
                        "Question": formatted_question,
                        "Multiple Choice": formatted_choices,
                        "Correct Answer": correct_answer
                    },
                    "tags": TAGS,
                    "options": {
                        "allowDuplicate": ALLOW_DUPLICATES
                    }
                }

                payload = {
                    "action": "addNote",
                    "version": 6,
                    "params": {
                        "note": card_data
                    }
                }

                response = requests.post(ANKI_CONNECT_URL, json=payload)

                if response.status_code == 200:
                    response_json = response.json()
                    if response_json.get("error") is None:
                        print(f"Card successfully added: {question}")
                    else:
                        print(f"Error adding card: {response_json.get('error')}")
                else:
                    print(f"Request failed with status code: {response.status_code}")
    except FileNotFoundError:
        print(f"Error: The file '{csv_filename}' was not found.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


if __name__ == "__main__":
    add_cards_from_csv(CSV_FILENAME)

