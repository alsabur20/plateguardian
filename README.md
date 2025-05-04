# PlateGuardian

A secure, user-based number plate recognition system using OCR and Zero Trust principles.  
Built with Flask, React, and a custom-trained OCR model for vehicle license plate scanning, logging, and access control.

---

## 🚀 Features

- 🔐 **Zero Trust Architecture** for robust security
- 📷 AI-powered OCR to detect and recognize license plates
- 🔑 RSA-based encrypted API key issuance
- 🧑‍💼 User authentication and session management
- 📊 Logging and per-user OCR history
- 🌐 REST API built with Flask
- 🎨 Frontend powered by React

---

## 🛠️ Technologies Used

- Python + Flask
- React.js
- SQLAlchemy (for ORM)
- OpenCV + scikit-learn (OCR model)
- RSA (asymmetric encryption)
- Flask-Session & Bcrypt
- Joblib (model persistence)

---

## ⚙️ Setup Instructions

### 🔧 Backend (Flask API)

1. **Clone the repo**:
   ```bash
   git clone https://github.com/alsabur20/plateguardian.git
   cd plateguardian/backend

2. **Create and activate a virtual environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate

3. **Install the dependencies**:
    ```bash
    pip install -r requirements.txt
4. **Run the Flask server**:
    ```bash
    flask run
5. **By default, the server runs on http://127.0.0.1:5000/**.

### 💻 Frontend (React App)
1. **Navigate to the frontend folder**:
    ```bash
    cd ../frontend

2. **Install dependencies**:
    ```bash
    npm install
3. **Run the React app**:
    ```bash
    npm start
4. **Open http://localhost:3000 to access the UI.**:

### 🔐 Security Highlights
- All API keys are RSA-encrypted before delivery.

- Each user session is isolated and tied to a unique API key.

- API requests require valid, non-expired tokens.

- Events are logged for future audit and monitoring.

### 📈 Future Improvements
- Integrate CNN-based OCR for better accuracy

- Add JWT-based stateless auth

- Store images in cloud (e.g., S3)

- Add admin dashboards and analytics

### 📄 License
This project is licensed under the MIT License.
Feel free to use, modify, and distribute with attribution.

🤝 Contributing
Pull requests are welcome!
For major changes, please open an issue first to discuss what you'd like to change.

