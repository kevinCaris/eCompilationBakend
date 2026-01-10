const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API REST - Gestion Utilisateurs',
      version: '1.0.0',
      description: 'Documentation complète de l\'API REST avec Express et Prisma'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Serveur de développement'
      }
    ],
    components: {
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1
            },
            email: {
              type: 'string',
              example: 'jean@example.com'
            },
            name: {
              type: 'string',
              example: 'Jean Dupont'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-06T10:30:00Z'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-06T10:30:00Z'
            }
          },
          required: ['id', 'email', 'createdAt', 'updatedAt']
        },
        UserInput: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              example: 'jean@example.com'
            },
            name: {
              type: 'string',
              example: 'Jean Dupont'
            }
          },
          required: ['email']
        },
        ApiResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['success', 'error'],
              example: 'success'
            },
            code: {
              type: 'integer',
              example: 200
            },
            message: {
              type: 'string',
              example: 'Utilisateur créé'
            },
            data: {
              type: 'object'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'] // Cherche les commentaires JSDoc dans les routes
};

const specs = swaggerJsdoc(options);

module.exports = { swaggerUi, specs };