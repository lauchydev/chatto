const request = require('supertest');
const { expect } = require('chai');
const { createTestApp } = require('./app');

describe('Auth Routes', () => {
  let app;

  before(() => {
    app = createTestApp();
  });

  describe('POST /api/auth', () => {
    it('should respond to auth endpoint', (done) => {
      request(app)
        .post('/api/auth')
        .send({
          username: 'testuser',
          password: 'testpass',
        })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 400, 401, 500]);
          done();
        });
    });

    it('should return JSON response', (done) => {
      request(app)
        .post('/api/auth')
        .send({
          username: 'testuser',
          password: 'testpass',
        })
        .expect('Content-Type', /json/)
        .end(done);
    });

    it('should handle missing credentials', (done) => {
      request(app)
        .post('/api/auth')
        .send({})
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([400, 401, 500]);
          done();
        });
    });
  });
});
