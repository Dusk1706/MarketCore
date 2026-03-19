from marshmallow import Schema, fields, validate
from app.schemas.user import UserSchema
from app.schemas.product import ProductSchema


class OrderSchema(Schema):
    id = fields.Int(dump_only=True)
    buyer_id = fields.Int(dump_only=True)
    seller_id = fields.Int(dump_only=True)
    product_id = fields.Int(dump_only=True)
    total_amount = fields.Float(dump_only=True)
    status = fields.Method("get_status", dump_only=True)
    payment_gateway_id = fields.Str(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    
    buyer = fields.Nested(UserSchema, dump_only=True)
    seller = fields.Nested(UserSchema, dump_only=True)
    product = fields.Nested(ProductSchema, dump_only=True)

    def get_status(self, obj):
        return obj.status.name if obj.status else None


class OrderCreateSchema(Schema):
    product_id = fields.Int(required=True)


class ReviewSchema(Schema):
    id = fields.Int(dump_only=True)
    order_id = fields.Int(dump_only=True)
    reviewer_id = fields.Int(dump_only=True)
    reviewee_id = fields.Int(dump_only=True)
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    comment = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    
    reviewer = fields.Nested(UserSchema, dump_only=True)


class ReviewCreateSchema(Schema):
    rating = fields.Int(required=True, validate=validate.Range(min=1, max=5))
    comment = fields.Str(allow_none=True)


class MessageSchema(Schema):
    id = fields.Int(dump_only=True)
    conversation_id = fields.Int(dump_only=True)
    sender_id = fields.Int(dump_only=True)
    content = fields.Str(required=True)
    is_read = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    
    sender = fields.Nested(UserSchema, dump_only=True)


class MessageCreateSchema(Schema):
    content = fields.Str(required=True)


class ConversationSchema(Schema):
    id = fields.Int(dump_only=True)
    buyer_id = fields.Int(dump_only=True)
    seller_id = fields.Int(dump_only=True)
    product_id = fields.Int(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    
    buyer = fields.Nested(UserSchema, dump_only=True)
    seller = fields.Nested(UserSchema, dump_only=True)
    product = fields.Nested(ProductSchema, dump_only=True)
    
    # We might want to include the last message or unread count but let's keep it simple for now
    messages = fields.Nested(MessageSchema, many=True, dump_only=True)

class ConversationCreateSchema(Schema):
    product_id = fields.Int(required=True)
    content = fields.Str(required=True)
