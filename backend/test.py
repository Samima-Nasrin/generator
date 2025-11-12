import google.generativeai as genai
genai.configure(api_key="AIzaSyD-21NSqJdYfmYQO2ILUuD6au6uZWnIiB4")
for m in genai.list_models():
    print(m.name)