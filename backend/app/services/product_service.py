from app.repositories.product_repository import ProductRepository
from app.repositories.category_repository import CategoryRepository
from app.models.product import Product
from app.core.exceptions import NotFoundError, ForbiddenError

class ProductService:
    @staticmethod
    def get_products(filters):
        pagination_obj = ProductRepository.get_all(**filters)
        return {
            "items": pagination_obj.items,
            "total": pagination_obj.total,
            "page": pagination_obj.page,
            "per_page": pagination_obj.per_page,
            "pages": pagination_obj.pages
        }

    @staticmethod
    def get_product(product_id):
        product = ProductRepository.get_by_id(product_id)
        if not product:
            raise NotFoundError("Product not found")
        return product

    @staticmethod
    def create_product(data, user_id):
        category = CategoryRepository.get_by_slug(data['category_slug'])
        if not category:
            raise NotFoundError("Category not found")

        product = Product(
            title=data['title'],
            description=data['description'],
            price=data['price'],
            image_url=data.get('image_url'),
            category_id=category.id,
            user_id=user_id
        )
        return ProductRepository.save(product)

    @staticmethod
    def update_product(product_id, data, user_id):
        product = ProductRepository.get_by_id(product_id)
        if not product:
            raise NotFoundError("Product not found")
        
        if product.user_id != user_id:
            raise ForbiddenError("You do not have permission to edit this product")

        if 'category_slug' in data:
            category = CategoryRepository.get_by_slug(data['category_slug'])
            if not category:
                raise NotFoundError("Category not found")
            product.category_id = category.id

        product.title = data.get('title', product.title)
        product.description = data.get('description', product.description)
        product.price = data.get('price', product.price)
        product.image_url = data.get('image_url', product.image_url)
        product.is_sold = data.get('is_sold', product.is_sold)

        return ProductRepository.save(product)

    @staticmethod
    def delete_product(product_id, user_id):
        product = ProductRepository.get_by_id(product_id)
        if not product:
            raise NotFoundError("Product not found")
        
        if product.user_id != user_id:
            raise ForbiddenError("You do not have permission to delete this product")

        ProductRepository.delete(product)
