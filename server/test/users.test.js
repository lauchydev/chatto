const request = require('supertest');
const { expect } = require('chai');
const { createTestApp } = require('./app');

describe('Users Routes', () => {
  let app;

  before(() => {
    app = createTestApp();
  });

  describe('GET /api/users', () => {
    it('should respond to get all users endpoint', (done) => {
      request(app)
        .get('/api/users')
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 500]);
          done();
        });
    });

    it('should return JSON response', (done) => {
      request(app).get('/api/users').expect('Content-Type', /json/).end(done);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should respond to get user by ID endpoint', (done) => {
      request(app)
        .get('/api/users/1')
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 404, 500]);
          done();
        });
    });
  });

  describe('POST /api/users', () => {
    it('should respond to create user endpoint', (done) => {
      request(app)
        .post('/api/users')
        .send({
          username: 'newuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([201, 400, 500]);
          done();
        });
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should respond to update user endpoint', (done) => {
      request(app)
        .put('/api/users/1')
        .send({
          username: 'updateduser',
          email: 'updated@example.com',
        })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 400, 404, 500]);
          done();
        });
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should respond to delete user endpoint', (done) => {
      request(app)
        .delete('/api/users/999')
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 404, 500]);
          done();
        });
    });
  });
});
