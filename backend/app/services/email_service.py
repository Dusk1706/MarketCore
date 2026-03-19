import logging

logger = logging.getLogger(__name__)

class EmailService:
    @staticmethod
    def send_verification_email(to_email: str, verify_url: str) -> None:
        # In a production environment, you would use SendGrid, SES, or similar here.
        logger.info(f"\n{'='*50}\n[MOCK EMAIL] To: {to_email}\nSubject: Verify your MarketCore account\n\nPlease click the following link to verify your email:\n{verify_url}\n{'='*50}\n")

    @staticmethod
    def send_password_reset_email(to_email: str, reset_url: str) -> None:
        logger.info(f"\n{'='*50}\n[MOCK EMAIL] To: {to_email}\nSubject: Reset your MarketCore password\n\nYou requested a password reset. Click the link below to set a new password:\n{reset_url}\n{'='*50}\n")
