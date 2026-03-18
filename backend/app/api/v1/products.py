from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import ValidationError
from app.schemas.product import ProductSchema, ProductCreateSchema, ProductUpdateSchema
from app.services.product_service import ProductService
from app.core.exceptions import AuthenticationError

products_bp = Blueprint('products', __name__, url_prefix='/products')

@products_bp.route('', methods=['GET'])
def get_products():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    filters = {
        'search': request.args.get('search'),
        'category_slug': request.args.get('category_slug'),
        'min_price': request.args.get('min_price', type=float),
        'max_price': request.args.get('max_price', type=float),
        'seller_id': None,
        'page': page,
        'per_page': per_page
    }
    
    if request.args.get('seller_only') == 'true':
        @jwt_required()
        def get_seller_id():
            return int(get_jwt_identity())
        
        try:
            filters['seller_id'] = get_seller_id()
        except:
            raise AuthenticationError("Authentication required for seller_only")

    result = ProductService.get_products(filters)
    schema = ProductSchema(many=True)
    
    return jsonify({
        "products": schema.dump(result['items']),
        "meta": {
            "total": result['total'],
            "page": result['page'],
            "per_page": result['per_page'],
            "pages": result['pages']
        }
    }), 200

@products_bp.route('/<int:id>', methods=['GET'])
def get_product(id):
    product = ProductService.get_product(id)
    schema = ProductSchema()
    return jsonify(schema.dump(product)), 200

@products_bp.route('', methods=['POST'])
@jwt_required()
def create_product():
    schema = ProductCreateSchema()
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400

    user_id = int(get_jwt_identity())
    product = ProductService.create_product(data, user_id)
    return jsonify({"message": "Product created successfully", "id": product.id}), 201

@products_bp.route('/<int:id>', methods=['PUT', 'PATCH'])
@jwt_required()
def update_product(id):
    schema = ProductUpdateSchema()
    try:
        data = schema.load(request.json)
    except ValidationError as err:
        return jsonify(err.messages), 400

    user_id = int(get_jwt_identity())
    ProductService.update_product(id, data, user_id)
    return jsonify({"message": "Product updated successfully"}), 200

@products_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_product(id):
    user_id = int(get_jwt_identity())
    ProductService.delete_product(id, user_id)
    return '', 204
