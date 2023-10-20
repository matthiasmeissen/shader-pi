import socketio
import time
import random

sio = socketio.Client()

@sio.on('connect')
def on_connect():
    print('Connected to Node.js server')

@sio.on('disconnect')
def on_disconnect():
    print('Disconnected from Node.js server')

sio.connect('http://localhost:3000')

try:
    while True:
        data = {"value": random.random()}
        sio.emit('data_from_python', data)
        time.sleep(2)
except KeyboardInterrupt:
    print("Shutting down")
    sio.disconnect()
