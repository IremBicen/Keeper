import json
import csv
from pathlib import Path


def main():
  # Path to the original JSON file
  json_path = Path(r"C:\Users\İremSuBiçen\Downloads\dovec_users.json")

  # Output CSV file (Excel-compatible)
  output_path = json_path.with_name("dovec_users_name_email_passwords.csv")

  if not json_path.exists():
    raise FileNotFoundError(f"JSON file not found: {json_path}")

  with json_path.open("r", encoding="utf-8") as f:
    data = json.load(f)

  # Ensure data is a list of user objects
  if not isinstance(data, list):
    raise ValueError("Expected JSON to be a list of user objects")

  # Write CSV with BOM so Excel on Windows opens UTF-8 correctly
  with output_path.open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.writer(f)
    # Header
    writer.writerow(["name", "email", "password"])

    for user in data:
      name = user.get("name", "")
      email = user.get("email", "")
      password = user.get("password", "")
      writer.writerow([name, email, password])

  print(f"Created CSV file with name, email, password at: {output_path}")


if __name__ == "__main__":
  main()


