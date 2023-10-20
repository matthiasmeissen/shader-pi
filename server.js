const express = require('express')
const http = require('http')
const socketIo = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = socketIo(server)

app.use(express.static('public'))

io.on('connection', (socket) => {
    console.log('Client connected')

    socket.on('data_from_python', (data) => {
        console.log('Data received from Python:', data)

        io.emit('update_frontend', data)
    })
})

server.listen(3000, () => {
    console.log('Server is running on port 3000')
})
