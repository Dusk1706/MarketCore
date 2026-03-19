from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from sqlalchemy import or_

from app.extensions import db
from app.models.product import Product
from app.models.user import User
from app.models.interaction import Order, Review, Conversation, Message, OrderStatus
from app.schemas.interaction import (
    OrderSchema, OrderCreateSchema, ReviewSchema, ReviewCreateSchema,
    ConversationSchema, ConversationCreateSchema, MessageSchema, MessageCreateSchema
)

interactions_bp = Blueprint("interactions", __name__)

# --- ORDERS ---

@interactions_bp.route("/orders", methods=["POST"])
@jwt_required()
def create_order():
    current_user_id = int(get_jwt_identity())
    try:
        data = OrderCreateSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify(err.messages), 400

    product = db.session.get(Product, data["product_id"])
    if not product:
        return jsonify({"message": "Product not found"}), 404

    if product.is_sold:
        return jsonify({"message": "Product is already sold"}), 400

    if product.user_id == current_user_id:
        return jsonify({"message": "You cannot buy your own product"}), 400

    order = Order(
        buyer_id=current_user_id,
        seller_id=product.user_id,
        product_id=product.id,
        total_amount=product.price,
        status=OrderStatus.PAID
    )
    product.is_sold = True

    db.session.add(order)
    db.session.commit()

    return jsonify(OrderSchema().dump(order)), 201


@interactions_bp.route("/orders/me", methods=["GET"])
@jwt_required()
def get_my_orders():
    current_user_id = int(get_jwt_identity())
    orders = Order.query.filter(
        or_(Order.buyer_id == current_user_id, Order.seller_id == current_user_id)
    ).all()
    return jsonify(OrderSchema(many=True).dump(orders)), 200


# --- REVIEWS ---

@interactions_bp.route("/orders/<int:order_id>/reviews", methods=["POST"])
@jwt_required()
def create_review(order_id):
    current_user_id = int(get_jwt_identity())
    order = db.session.get(Order, order_id)
    if not order:
        return jsonify({"message": "Order not found"}), 404

    if order.buyer_id != current_user_id:
        return jsonify({"message": "Only the buyer can review"}), 403

    if order.status not in [OrderStatus.PAID, OrderStatus.COMPLETED]:
        return jsonify({"message": "Order must be completed to review"}), 400

    if order.review:
        return jsonify({"message": "Review already exists for this order"}), 400

    try:
        data = ReviewCreateSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify(err.messages), 400

    review = Review(
        order_id=order.id,
        reviewer_id=current_user_id,
        reviewee_id=order.seller_id,
        rating=data["rating"],
        comment=data.get("comment")
    )
    db.session.add(review)
    db.session.commit()

    return jsonify(ReviewSchema().dump(review)), 201


@interactions_bp.route("/users/<int:user_id>/reviews", methods=["GET"])
def get_user_reviews(user_id):
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    reviews = Review.query.filter_by(reviewee_id=user_id).all()
    
    total_sales = Order.query.filter_by(seller_id=user_id, status=OrderStatus.PAID).count()
    # Actually, we should count all PAID/COMPLETED but we'll just count PAID or COMPLETED
    total_sales = Order.query.filter(
        Order.seller_id == user_id, 
        Order.status.in_([OrderStatus.PAID, OrderStatus.COMPLETED])
    ).count()

    if reviews:
        average_rating = sum(r.rating for r in reviews) / len(reviews)
    else:
        average_rating = 0.0

    return jsonify({
        "average_rating": average_rating,
        "total_sales": total_sales,
        "reviews": ReviewSchema(many=True).dump(reviews)
    }), 200

# --- MESSAGING ---

@interactions_bp.route("/conversations", methods=["POST"])
@jwt_required()
def create_conversation():
    current_user_id = int(get_jwt_identity())
    try:
        data = ConversationCreateSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify(err.messages), 400

    product = db.session.get(Product, data["product_id"])
    if not product:
        return jsonify({"message": "Product not found"}), 404

    if product.user_id == current_user_id:
        return jsonify({"message": "You cannot start a conversation with yourself"}), 400

    # Check if conversation already exists
    conv = Conversation.query.filter_by(
        buyer_id=current_user_id,
        seller_id=product.user_id,
        product_id=product.id
    ).first()

    if not conv:
        conv = Conversation(
            buyer_id=current_user_id,
            seller_id=product.user_id,
            product_id=product.id
        )
        db.session.add(conv)
        db.session.flush()

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user_id,
        content=data["content"]
    )
    db.session.add(msg)
    db.session.commit()

    return jsonify(ConversationSchema().dump(conv)), 201


@interactions_bp.route("/conversations", methods=["GET"])
@jwt_required()
def get_conversations():
    current_user_id = int(get_jwt_identity())
    convs = Conversation.query.filter(
        or_(Conversation.buyer_id == current_user_id, Conversation.seller_id == current_user_id)
    ).all()
    return jsonify(ConversationSchema(many=True).dump(convs)), 200


@interactions_bp.route("/conversations/<int:conv_id>/messages", methods=["GET"])
@jwt_required()
def get_messages(conv_id):
    current_user_id = int(get_jwt_identity())
    conv = db.session.get(Conversation, conv_id)
    if not conv:
        return jsonify({"message": "Conversation not found"}), 404

    if current_user_id not in [conv.buyer_id, conv.seller_id]:
        return jsonify({"message": "Unauthorized"}), 403

    messages = conv.messages.all()
    return jsonify(MessageSchema(many=True).dump(messages)), 200


@interactions_bp.route("/conversations/<int:conv_id>/messages", methods=["POST"])
@jwt_required()
def add_message(conv_id):
    current_user_id = int(get_jwt_identity())
    conv = db.session.get(Conversation, conv_id)
    if not conv:
        return jsonify({"message": "Conversation not found"}), 404

    if current_user_id not in [conv.buyer_id, conv.seller_id]:
        return jsonify({"message": "Unauthorized"}), 403

    try:
        data = MessageCreateSchema().load(request.get_json() or {})
    except ValidationError as err:
        return jsonify(err.messages), 400

    msg = Message(
        conversation_id=conv.id,
        sender_id=current_user_id,
        content=data["content"]
    )
    db.session.add(msg)
    db.session.commit()

    return jsonify(MessageSchema().dump(msg)), 201
