from legal_writer.models import DocumentTemplate


def get_active_templates():
    return DocumentTemplate.objects.filter(is_active=True)


def get_template_by_id(template_id):
    return DocumentTemplate.objects.filter(id=template_id, is_active=True).first()


def get_template_by_name(name):
    return DocumentTemplate.objects.filter(name__iexact=name, is_active=True).first()
