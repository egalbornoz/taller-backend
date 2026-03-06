-- ================================
-- SISTEMA TALLER ECU / VEHÍCULOS
-- MySQL 8+
-- ================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================
-- ROLES Y USUARIOS
-- ================================

CREATE TABLE roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);
use taller;
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol_id INT NOT NULL,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (rol_id) REFERENCES roles(id)
);

INSERT INTO roles (nombre) VALUES
('ADMIN'),
('RECEPCION'),
('TECNICO');

-- ================================
-- CLIENTES Y VEHÍCULOS
-- ================================

CREATE TABLE clientes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  telefono VARCHAR(30),
  email VARCHAR(150),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehiculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  marca VARCHAR(100),
  modelo VARCHAR(100),
  anio INT,
  placa VARCHAR(20),
  vin VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- ================================
-- MÓDULOS / ECU
-- ================================

CREATE TABLE modulos_ecu (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo VARCHAR(100),
  marca VARCHAR(100),
  numero_parte VARCHAR(100),
  serial VARCHAR(100),
  observaciones TEXT
);

-- ================================
-- ÓRDENES DE TRABAJO
-- ================================

CREATE TABLE ordenes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  vehiculo_id INT NOT NULL,
  modulo_id INT,
  estado ENUM(
    'RECIBIDO',
    'EN_REVISION',
    'PRESUPUESTADO',
    'APROBADO',
    'EN_REPARACION',
    'TERMINADO',
    'ENTREGADO',
    'CANCELADO'
  ) NOT NULL DEFAULT 'RECIBIDO',
  asignado_por INT,
  tecnico_id INT,
  observaciones TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
  FOREIGN KEY (modulo_id) REFERENCES modulos_ecu(id),
  FOREIGN KEY (asignado_por) REFERENCES usuarios(id),
  FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
);

-- ================================
-- HISTORIAL DE ESTADOS
-- ================================

CREATE TABLE orden_estado_historial (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orden_id INT NOT NULL,
  estado ENUM(
    'RECIBIDO',
    'EN_REVISION',
    'PRESUPUESTADO',
    'APROBADO',
    'EN_REPARACION',
    'TERMINADO',
    'ENTREGADO',
    'CANCELADO'
  ) NOT NULL,
  cambiado_por INT NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES ordenes(id),
  FOREIGN KEY (cambiado_por) REFERENCES usuarios(id)
);

-- ================================
-- REVISIÓN TÉCNICA
-- ================================

CREATE TABLE revisiones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orden_id INT NOT NULL,
  tecnico_id INT NOT NULL,
  diagnostico TEXT NOT NULL,
  costo_revision DECIMAL(10,2) DEFAULT 0,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES ordenes(id),
  FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
);

-- ================================
-- REPARACIONES
-- ================================

CREATE TABLE reparaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orden_id INT NOT NULL,
  tecnico_id INT NOT NULL,
  descripcion TEXT NOT NULL,
  costo_reparacion DECIMAL(10,2) DEFAULT 0,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES ordenes(id),
  FOREIGN KEY (tecnico_id) REFERENCES usuarios(id)
);

-- ================================
-- MOVIMIENTOS FINANCIEROS
-- ================================

CREATE TABLE movimientos_financieros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orden_id INT,
  tipo ENUM('INGRESO','EGRESO') NOT NULL,
  concepto VARCHAR(150),
  monto DECIMAL(10,2) NOT NULL,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES ordenes(id)
);

-- ================================
-- NOTIFICACIONES
-- ================================

CREATE TABLE notificaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orden_id INT,
  canal ENUM('EMAIL','WHATSAPP') NOT NULL,
  destino VARCHAR(150),
  mensaje TEXT,
  enviado BOOLEAN DEFAULT FALSE,
  fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (orden_id) REFERENCES ordenes(id)
);

-- ================================
-- ÍNDICES RECOMENDADOS
-- ================================

CREATE INDEX idx_orden_estado ON ordenes(estado);
CREATE INDEX idx_movimientos_fecha ON movimientos_financieros(fecha);
CREATE INDEX idx_notificaciones_enviado ON notificaciones(enviado);

SET FOREIGN_KEY_CHECKS = 1;
