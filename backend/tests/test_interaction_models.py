import pytest
from app.models.interaction import Order, Review, Conversation, Message, OrderStatus
from app.extensions import db

def test_order_creation(app):
    with app.app_context():
        order = Order(
            buyer_id=1,
            seller_id=2,
            product_id=1,
            total_amount=100.50,
            status=OrderStatus.PAID
        )
        db.session.add(order)
        db.session.commit()
        
        saved_order = db.session.get(Order, order.id)
        assert saved_order is not None
        assert saved_order.total_amount == 100.50

def test_review_creation(app):
    with app.app_context():
        review = Review(
            order_id=1,
            reviewer_id=1,
            reviewee_id=2,
            rating=5,
            comment="Great product!"
        )
        db.session.add(review)
        db.session.commit()
        
        saved_review = db.session.get(Review, review.id)
        assert saved_review is not None
        assert saved_review.rating == 5

def test_conversation_creation(app):
    with app.app_context():
        conversation = Conversation(
            buyer_id=1,
            seller_id=2,
            product_id=1
        )
        db.session.add(conversation)
        db.session.commit()
        
        saved_conv = db.session.get(Conversation, conversation.id)
        assert saved_conv is not None
        assert saved_conv.buyer_id == 1

def test_message_creation(app):
    with app.app_context():
        message = Message(
            conversation_id=1,
            sender_id=1,
            content="Hello there"
        )
        db.session.add(message)
        db.session.commit()
        
        saved_msg = db.session.get(Message, message.id)
        assert saved_msg is not None
        assert saved_msg.is_read is False
        assert saved_msg.content == "Hello there"
