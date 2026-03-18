from marshmallow import Schema, fields, validate


class UserProfileUpdateSchema(Schema):
    name = fields.Str(validate=validate.Length(min=2))
    email = fields.Email()


class UserPasswordUpdateSchema(Schema):
    current_password = fields.Str(required=True)
    new_password = fields.Str(required=True, validate=validate.Length(min=8))
