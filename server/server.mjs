import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import pg from 'pg';
import { hash, compare } from 'bcrypt';
import jwt from 'jsonwebtoken';

const { sign, verify } = jwt;
const { Client } = pg;
const server = fastify({
  logger: true,
});
const SECRET_KEY = 'VEry strOng SecRet Key';
const client = new Client({
  database: 'todo',
  user: 'postgres',
  password: 'postgres',
  port: 5556,
  host: 'localhost',
});

server.register(fastifyCors);
server.register(fastifyMultipart, {
  addToBody: true,
});
const authSchema = {
  body: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        minLength: 6,
        maxLength: 30,
      },
      password: {
        type: 'string',
        minLength: 8,
        maxLength: 50,
      },
    },
    required: ['email', 'password'],
  },
};

server.post(
  '/register',
  {
    schema: authSchema,
  },
  async (request, reply) => {
    const { email, password } = request.body;
    const { rows } = await client.query('SELECT * FROM users WHERE email=$1;', [
      email,
    ]);

    if (!rows.length) {
      const hashedPassword = await hash(password, 10);
      await client.query(
        'INSERT INTO users (email, password) VALUES ($1, $2);',
        [email, hashedPassword]
      );

      return reply.send({ info: 'User successful created' });
    }

    reply.status(400).send({ info: 'User already exist' });
  }
);

server.post('/login', { schema: authSchema }, async (request, reply) => {
  const { email, password } = request.body;

  const { rows } = await client.query('SELECT * FROM users WHERE email=$1;', [
    email,
  ]);

  if (rows.length) {
    const [user] = rows;

    const isValidPassword = await compare(password, user.password);

    if (isValidPassword) {
      const token = await sign({ id: user.id, email: user.email }, SECRET_KEY, {
        expiresIn: '50m',
      });
      return reply.send({ info: 'Successful login', token });
    }

    return reply.status(400).send({ info: 'incorrect password' });
  }

  reply.status(400).send({ info: 'User does not exist' });
});

server.register((instance, opts, done) => {
  instance.addHook('onRequest', async (request, reply) => {
    const { token } = request.headers;
    try {
      const payload = await verify(token, SECRET_KEY);

      request.user = payload;
    } catch (err) {
      return reply.status(401).send({ info: 'unauthorized' });
    }
  });

  instance.get(
    '/tasks',
    {
      schema: {
        headers: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
            },
          },
          required: ['token'],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.user;

      const { rows: tasks } = await client.query(
        'SELECT * FROM tasks WHERE userid=$1;',
        [id]
      );

      return reply.send(tasks);
    }
  );

  instance.post(
    '/tasks',
    {
      schema: {
        headers: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
            },
          },
          required: ['token'],
        },
        body: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            deadline: {
              type: 'string',
            },
          },
          required: ['name', 'deadline'],
        },
      },
    },
    async (request, reply) => {
      const { id } = request.user;
      const { name, deadline } = request.body;

      await client.query(
        'INSERT INTO tasks(name, deadline, userid) VALUES ($1, $2, $3);',
        [name, deadline, payload.id]
      );

      reply.status(201).send({ info: 'created' });
    }
  );

  instance.patch(
    '/task/complete/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'number' },
          },
          required: ['id'],
        },
      },
    },
    async (request, reply) => {
      const { user } = request;
      const { id } = request.params;
      const {
        rows: [task],
      } = await client.query('SELECT * FROM tasks WHERE id=$1 AND userid=$2;', [
        id,
        user.id,
      ]);

      if (task) {
        await client.query('UPDATE tasks SET iscompleted = TRUE WHERE id=$1;', [
          id,
        ]);

        return reply.send({ info: 'updated' });
      }

      reply.status(400).send({ info: 'Task does not exist' });
    }
  );

  done();
});

server.get('/request', (request, reply) => {
  reply.send({ test: 'test' });
});

server.get('/page', (request, reply) => {
  reply
    .header('content-type', 'text/html')
    .send(
      '<link rel="stylesheet" href="/styles.css"><h1>Hello my name is Bohdan</h1>'
    );
});

server.get('/styles.css', (request, reply) => {
  reply.header('content-type', 'text/css').send('h1 { color: aqua; }');
});

server
  .listen({
    port: 4000,
    host: '0.0.0.0',
  })
  .then(() => {
    return client.connect();
  })
  .catch((err) => console.log(err));
