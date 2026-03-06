import express from 'express';
import logger from 'morgan';
import cors from 'cors';
import http from 'http';
import { Server as SocketServer } from 'socket.io';

import usersRouter from '../routes/users.js';
import authRouter from '../routes/auth.js';
import clientRouter from '../routes/clients.js';
import vehiclesRouter from '../routes/vehicles.js';
import modulesRouter from '../routes/modules.js';
import notificationsRouter from '../routes/notifications.js';
import ordersRouter from '../routes/orders.js';
import reviewsRouter from '../routes/reviews.js';
import repairsRouter from '../routes/repairs.js';
import reportsRouter from '../routes/reports.js';
import colaboratorsRouter from '../routes/colaborators.js';
import orderHistoryRouter from '../routes/orders_history.js';
import tariffsRouter from '../routes/tariffs.js';
import movementsRouter from '../routes/movimientos.js';
import inventoryRoutes from '../routes/inventory.js';

import colors from 'colors';
import { db } from '../database/config.js';

class Server {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 3000;
        this.app.use(logger('dev'));
        // --- VARIABLE DE ENTORNO PARA LOS CORS ---
        // Lee el .env, si no hay nada, usa un array vacío. Separa por comas.
        this.origenesPermitidos = process.env.FRONTEND_URL
            ? process.env.FRONTEND_URL.split(',')
            : ['http://localhost:4000'];

        this.httpServer = http.createServer(this.app);

        // Configuramos Socket.io con la variable de entorno
        this.io = new SocketServer(this.httpServer, {
            cors: {
                origin: this.origenesPermitidos,
                credentials: true,
                methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
            }
        });

        this.app.set('io', this.io);

        this.path = {
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            clients: '/api/v1/clients',
            vehicles: '/api/v1/vehicles',
            modules: '/api/v1/modules',
            notifications: '/api/v1/notifications',
            orders: '/api/v1/orders',
            reviews: '/api/v1/reviews',
            orderHistory: '/api/v1/order_history',
            repairs: '/api/v1/repairs',
            reports: '/api/v1/reports',
            colaborators: '/api/v1/colaborators',
            tariffs: '/api/v1/tariffs',
            movements: '/api/v1/movements',
            inventory:'/api/v1/inventory',
        };

        this.conectionDB();
        this.middlewares();
        this.routes();
        this.sockets();
    }

    async conectionDB() { await db(); }

    middlewares() {
        this.app.use(cors({
            origin: this.origenesPermitidos,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
        }));
        this.app.use(express.json());
        this.app.use(express.static('public'));
    }

    routes() {
        this.app.use(this.path.users, usersRouter);
        this.app.use(this.path.auth, authRouter);
        this.app.use(this.path.clients, clientRouter);
        this.app.use(this.path.vehicles, vehiclesRouter);
        this.app.use(this.path.modules, modulesRouter);
        this.app.use(this.path.notifications, notificationsRouter);
        this.app.use(this.path.orders, ordersRouter);
        this.app.use(this.path.reviews, reviewsRouter);
        this.app.use(this.path.repairs, repairsRouter);
        // this.app.use(this.path.reports, reportsRouter);
        this.app.use('/api/v1/debug-reports', reportsRouter);
        this.app.use(this.path.colaborators, colaboratorsRouter);
        this.app.use(this.path.orderHistory, orderHistoryRouter);
        this.app.use(this.path.tariffs, tariffsRouter);
        this.app.use(this.path.movements, movementsRouter);
        this.app.use(this.path.inventory, inventoryRoutes);
    }

    sockets() {
        this.io.on('connection', (socket) => {
            console.log(colors.cyan.bold(`🟢 Frontend conectado via Socket: ${socket.id}`));
            socket.on('disconnect', () => {
                console.log(colors.red(`🔴 Frontend desconectado: ${socket.id}`));
            });
        });
    }

    listen() {
        this.httpServer.listen(this.port, () => {
            console.log(colors.white.bold(`Servidor API activo por el puerto ${this.port} `));
            console.log(colors.blue.bold(`Túnel de Sockets (Tiempo real) activado 🚀`));
        });
    }
}

export default Server;