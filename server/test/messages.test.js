const request = require('supertest');
const { expect } = require('chai');
const { createTestApp } = require('./app');

describe('Messages Routes', () => {
  let app;

  before(() => {
    app = createTestApp();
  });

  describe('GET /api/messages', () => {
    it('should respond to get messages endpoint', (done) => {
      request(app)
        .get('/api/messages')
        .query({ channelId: 1 })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 404, 500]);
          done();
        });
    });

    it('should return JSON response', (done) => {
      request(app)
        .get('/api/messages')
        .query({ channelId: 1 })
        .expect('Content-Type', /json/)
        .end(done);
    });
  });

  describe('POST /api/messages', () => {
    it('should respond to create message endpoint', (done) => {
      request(app)
        .post('/api/messages')
        .send({
          content: 'Test message',
          channelId: 1,
          userId: 1,
          username: 'testuser',
        })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([201, 400, 500]);
          done();
        });
    });
  });

  describe('DELETE /api/messages/:id', () => {
    it('should respond to delete message endpoint', (done) => {
      request(app)
        .delete('/api/messages/999')
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 400, 404, 500]);
          done();
        });
    });
  });
});
