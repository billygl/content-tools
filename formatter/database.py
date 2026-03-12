from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

db = SQLAlchemy()

class QueueItem(db.Model):
    __tablename__ = 'queue_items'
    
    id = db.Column(db.String, primary_key=True)
    text = db.Column(db.Text, nullable=False)
    media_path = db.Column(db.String)
    media_type = db.Column(db.String)
    target_time = db.Column(db.String, nullable=False)
    status = db.Column(db.String, nullable=False, default='pending')
    created_at = db.Column(db.String, nullable=False)
    published_at = db.Column(db.String)
    post_url = db.Column(db.String)
    error = db.Column(db.Text)

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'media_path': self.media_path,
            'media_type': self.media_type,
            'target_time': self.target_time,
            'status': self.status,
            'created_at': self.created_at,
            'published_at': self.published_at,
            'post_url': self.post_url,
            'error': self.error
        }

def init_db(app):
    os.makedirs("data", exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.abspath('data/queue.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    with app.app_context():
        db.create_all()

def get_queue():
    items = QueueItem.query.order_by(QueueItem.target_time.asc()).all()
    return [item.to_dict() for item in items]

def add_to_queue(item_data):
    item = QueueItem(
        id=item_data['id'],
        text=item_data['text'],
        media_path=item_data.get('media_path'),
        media_type=item_data.get('media_type'),
        target_time=item_data['target_time'],
        status=item_data.get('status', 'pending'),
        created_at=item_data['created_at']
    )
    db.session.add(item)
    db.session.commit()

def update_queue_item(item_id, updates):
    if not updates:
        return
    item = QueueItem.query.get(item_id)
    if item:
        for key, value in updates.items():
            setattr(item, key, value)
        db.session.commit()

def delete_from_queue(item_id):
    item = QueueItem.query.get(item_id)
    if item:
        db.session.delete(item)
        db.session.commit()
