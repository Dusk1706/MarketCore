from marshmallow import Schema, fields, validate
from app.schemas.user import UserSchema
from app.schemas.category import CategorySchema

class ProductSchema(Schema):
    id = fields.Int(dump_only=True)
    title = fields.Str(required=True)
    description = fields.Str(required=True)
    price = fields.Float(required=True, validate=validate.Range(min=0))
    category_slug = fields.Str(required=True)
    is_sold = fields.Bool(dump_only=True)
    image_url = fields.Str(allow_none=True)
    created_at = fields.DateTime(dump_only=True)
    seller = fields.Nested(UserSchema, dump_only=True)

class ProductCreateSchema(Schema):
    title = fields.Str(required=True)
    description = fields.Str(required=True)
    price = fields.Float(required=True, validate=validate.Range(min=0))
    category_slug = fields.Str(required=True)
    image_url = fields.Str(allow_none=True)

class ProductUpdateSchema(Schema):
    title = fields.Str()
    description = fields.Str()
    price = fields.Float(validate=validate.Range(min=0))
    category_slug = fields.Str()
    image_url = fields.Str(allow_none=True)
    is_sold = fields.Bool()
