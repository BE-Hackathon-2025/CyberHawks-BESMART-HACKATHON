# text_formatter.py
import re

def format_ai_response(text):
    """
    Format AI responses: put **bold** text on new lines and remove the asterisks
    """
    if not text:
        return text
    
    # Find all text surrounded by double asterisks and put them on new lines
    def bold_replacer(match):
        bold_text = match.group(1)  # Get the text inside ***
        return f"\n{bold_text}\n"
    
    # Remove double asterisks and put the content on new lines
    text = re.sub(r'\*\*(.*?)\*\*', bold_replacer, text)
    
    # Clean up any extra newlines
    text = re.sub(r'\n\s*\n', '\n\n', text)
    
    return text.strip()

def format_bullet_points(text):
    """
    Ensure consistent bullet point formatting
    """
    if not text:
        return text
    
    lines = text.split('\n')
    formatted_lines = []
    
    for line in lines:
        line = line.strip()
        if not line:
            formatted_lines.append('')
            continue
            
        # Convert various bullet styles to consistent •
        if re.match(r'^[-*•·]\s+', line):
            line = re.sub(r'^[-*•·]\s+', '• ', line)
            
        formatted_lines.append(line)
    
    return '\n'.join(formatted_lines)

def smart_format(text):
    """
    Main formatting function
    """
    if not text:
        return text
    
    # Apply bold formatting (remove ** and put on new lines)
    text = format_ai_response(text)
    
    # Ensure proper bullet point formatting
    text = format_bullet_points(text)
    
    return text.strip()

# Test function
def test_formatter():
    test_text = """**Recent Community Summary for PA:** Here is a summary of the recent community posts: **Overall Summary** The community is abuzz with various retail sales events. **Key Topics Being Discussed** Retail sales and seasonal discounts. **Important Events** FreshMart Fall Savings Weekend. **Any Questions or Requests** Grace Community Church encourages RSVPs."""
    
    print("ORIGINAL TEXT:")
    print(test_text)
    print("\n" + "="*80 + "\n")
    
    print("FORMATTED TEXT:")
    formatted = smart_format(test_text)
    print(formatted)

if __name__ == "__main__":
    test_formatter()