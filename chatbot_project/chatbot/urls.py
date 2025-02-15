from django.urls import path
from .views import upload_file, chatbot_query

urlpatterns = [
    path('upload/', upload_file, name='upload_file'),
    path('chat/', chatbot_query, name='chatbot_query'),
]
