from flask_socketio import join_room
from app.extensions import socketio

@socketio.on('join')
def on_join(data):
    """
    Client sends {'user_id': 1} to join their personal room
    """
    user_id = data.get('user_id')
    if user_id:
        room = f"user_{user_id}"
        join_room(room)
