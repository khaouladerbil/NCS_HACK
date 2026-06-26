from legal_path.models import LegalRequest


class LegalPathService:

    @staticmethod
    def create_request(user, data):

        return LegalRequest.objects.create(
            user=user,
            **data
        )