# **DocuChat AI** 📄💬  

DocuChat AI is an intelligent chatbot that allows users to upload documents and get AI-generated responses based on the content of the uploaded files. It supports **PDF, TXT, MD, and CSV** formats and uses **DeepSeek R1 (1.5B model) via Ollama** for processing queries.  

## **🚀 Features**  
✅ Upload documents (PDF, TXT, MD, CSV)  
✅ Extract text from uploaded files  
✅ Ask questions based on the document content  
✅ Uses DeepSeek R1 1.5B model via Ollama for AI-powered responses  
✅ Simple frontend (Next.js) and backend (Django)  

---

## **🛠️ Tech Stack**  

### **Frontend (Next.js)**
- React.js (App Router)  
- Tailwind CSS  
- Axios (for API requests)  

### **Backend (Django)**
- Django REST Framework  
- Ollama (DeepSeek R1 model for AI responses)  
- PyMuPDF (PDF text extraction)  
- SQLite (default database)  

---

## **📂 Folder Structure**  

```plaintext
DocuChat_AI/
│── Frontend/                # Next.js Frontend
│   ├── src/
│   │   ├── app/             # Next.js App Router
│   │   ├── components/      # Reusable UI components
│   │   ├── styles/          # CSS & Tailwind styles
│   │   ├── api/             # API calls to backend
│   ├── public/              # Static files
│   ├── package.json         # Dependencies & scripts
│
│── chatbot_project/                 # Django Backend
│   ├── api/
│   │   ├── views.py         # API endpoints for upload & chat
│   │   ├── models.py        # File storage model
│   │   ├── serializers.py   # Data serialization
│   ├── backend/
│   │   ├── settings.py      # Django settings
│   ├── uploads/             # Uploaded files
│   ├── manage.py            # Django CLI
│   ├── requirements.txt     # Backend dependencies
│
│── README.md                # Project documentation
│── .gitignore               # Ignored files (node_modules, env, etc.)
```

---

## **⚡ Installation & Setup**  

### **1️⃣ Clone the Repository**
```bash
git clone https://github.com/Atharva-Dhavale/DocuChat-AI.git
cd DocuChat-AI
```

---

### **2️⃣ Backend Setup (Django)**
#### **🔹 Install Dependencies**
Navigate to the backend folder and create a virtual environment:
```bash
cd chatbot_project
python3 -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
```

#### **🔹 Apply Migrations**
```bash
python manage.py migrate
```

#### **🔹 Run Django Server**
```bash
python manage.py runserver
```
Backend is now running at **http://127.0.0.1:8000/** 🎯

---

### **3️⃣ Frontend Setup (Next.js)**
#### **🔹 Install Dependencies**
Navigate to the frontend folder:
```bash
cd ../Frontend
npm install
```

#### **🔹 Run Frontend**
```bash
npm run dev
```
Frontend will be available at **http://localhost:3000/** 🚀

---

### **4️⃣ Install & Run Ollama with DeepSeek R1**
#### **🔹 Install Ollama (if not installed)**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

#### **🔹 Pull DeepSeek R1 Model**
```bash
ollama pull deepseek-r1:1.5b
```

#### **🔹 Verify Model**
```bash
ollama list
```
Ensure `deepseek-r1:1.5b` appears in the list.

#### **🔹 Run Ollama**
```bash
ollama serve
```

---

## **🚀 How to Use**
1️⃣ Upload a **PDF, TXT, MD, or CSV** file.  
2️⃣ Once uploaded, ask any question related to the document.  
3️⃣ The chatbot will generate a response based on the file’s content.  

---

## **🎯 API Endpoints**
### **1️⃣ Upload File**
- **URL:** `POST /api/upload/`
- **Request:** Form-data with `file`  
- **Response:** `{ "message": "File uploaded successfully", "file_content": "..." }`

### **2️⃣ Chatbot Query**
- **URL:** `POST /api/chat/`
- **Request:** `{ "message": "your query here" }`
- **Response:** `{ "response": "AI-generated response", "confidence": 85 }`

---

## **🐞 Troubleshooting**
### **🔴 `ModuleNotFoundError: No module named 'web-vitals'` (Frontend)**
```bash
npm install web-vitals
```

### **🔴 `Error processing chatbot query: model "deepseek:1.5b" not found`**
Ensure DeepSeek R1 model is pulled and Ollama is running:
```bash
ollama pull deepseek-r1:1.5b
ollama serve
```

### **🔴 `utf-8 codec can't decode byte` (File Upload)**
Ensure files are UTF-8 encoded. Use `PyMuPDF` for PDF parsing.

---

## **📜 License**
This project is open-source and available under the **MIT License**.

---
