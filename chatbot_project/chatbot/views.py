import ollama
import os
import logging
from rest_framework.response import Response
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from .models import UploadedFile
from .serializers import UploadedFileSerializer
from django.conf import settings
import PyPDF2

logger = logging.getLogger(__name__)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def upload_file(request):
    """
    Handles file upload and saves it to the database.
    """
    if 'file' not in request.FILES:
        return Response({"error": "No file provided"}, status=400)

    file_serializer = UploadedFileSerializer(data={"file": request.FILES['file']})

    if file_serializer.is_valid():
        file_instance = file_serializer.save()
        
        # Parse the file content
        file_path = file_instance.file.path
        try:
            if file_path.endswith('.pdf'):
                text = extract_text_from_pdf(file_path)
            else:
                with open(file_path, 'r', encoding='utf-8') as file:
                    text = file.read()

            return Response({
                "message": "File uploaded successfully",
                "file": file_serializer.data,
                "file_content": text[:10000]  # Return first 10000 chars as preview
            })
            
        except Exception as e:
            logger.error(f"Error reading file content: {str(e)}")
            return Response({"error": "Failed to read file content"}, status=500)
    
    return Response(file_serializer.errors, status=400)

import fitz 
@api_view(['POST'])
def chatbot_query(request):
    """
    Processes user query and responds based on the uploaded file.
    """
    try:
        # Get query from request data
        query = request.data.get("message")  # Changed from "query" to "message" to match frontend
        detailed = request.data.get("detailed", False)  # Get detailed mode parameter

        if not query:
            return Response({"error": "Message cannot be empty"}, status=400)

        # Fetch the latest uploaded file
        latest_file = UploadedFile.objects.last()

        if not latest_file:
            return Response({"error": "No file has been uploaded yet"}, status=400)

        file_path = latest_file.file.path

        # Extract text based on file type
        file_extension = os.path.splitext(file_path)[1].lower()

        if file_extension == ".pdf":
            try:
                text = extract_text_from_pdf(file_path)
            except Exception as e:
                return Response({"error": f"Error reading PDF: {str(e)}"}, status=500)
        elif file_extension in [".txt", ".md", ".csv"]:
            try:
                with open(file_path, "r", encoding="utf-8") as file:
                    text = file.read()
            except Exception as e:
                return Response({"error": f"Error reading file: {str(e)}"}, status=500)
        else:
            return Response({"error": "Unsupported file format. Please upload a PDF or text file."}, status=400)

        if not text.strip():
            return Response({"error": "File content is empty after extraction"}, status=400)

        # Adjust system prompt based on detailed mode
        system_prompt = (
            "You are an AI that provides detailed, comprehensive answers based on the uploaded document."
            if detailed
            else "You are an AI that provides concise, direct answers based on the uploaded document."
        )

        # Send extracted text and user query to DeepSeek R1
        response = ollama.chat(
            model="deepseek-r1:1.5b",
            messages=[
                {"role": "system", "content": system_prompt},
                # {"role": "user", "content": f"Document:\n{text}\n\ngive in short answer without bold and also use nextline whereever req\nQuery: {query}"}
                {
                    "role": "user",
                    "content": "Document:\n{text}\n\nQuery: {query}\nRespond shortly and conversationally. Avoid bold text and use newlines where needed."
                }

            ]
        )

        # Calculate a confidence score (this is a placeholder - you might want to implement
        # your own confidence scoring logic)
        confidence_score = 85  # Example fixed score

        return Response({
            "response": response['message']['content'],
            "confidence": confidence_score
        })

    except Exception as e:
        logger.error(f"Error processing chatbot query: {str(e)}")
        return Response({"error": str(e)}, status=500)

def extract_text_from_pdf(file_path):
    """
    Extracts text from a PDF file.
    """
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text("text") + "\n"
    return text