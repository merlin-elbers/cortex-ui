import uvicorn
from application import Application

if __name__ == '__main__':
    app = Application(['*'])
    uvicorn.run(app.app, port=8000, host='0.0.0.0')
