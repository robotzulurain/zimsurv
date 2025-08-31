from rest_framework.exceptions import ValidationError
import datetime

VALID_AST_RESULTS = ['S', 'I', 'R']

def validate_lab_result(data):
    errors = {}

    required_fields = ['organism', 'antibiotic', 'ast_result', 'test_date']
    for field in required_fields:
        if not data.get(field):
            errors[field] = 'This field is required.'

    if data.get('ast_result') and data['ast_result'] not in VALID_AST_RESULTS:
        errors['ast_result'] = 'AST result must be one of S, I, or R.'

    try:
        test_date = datetime.datetime.strptime(data['test_date'], '%Y-%m-%d').date()
        if test_date > datetime.date.today():
            errors['test_date'] = 'Test date cannot be in the future.'
    except (KeyError, ValueError):
        errors['test_date'] = 'Invalid test date format. Use YYYY-MM-DD.'

    if errors:
        raise ValidationError(errors)

    return data
