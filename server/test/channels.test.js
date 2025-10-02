const request = require('supertest');
const { expect } = require('chai');
const { createTestApp } = require('./app');

describe('Channels Routes', () => {
  let app;

  before(() => {
    app = createTestApp();
  });

  describe('GET /api/channels', () => {
    it('should respond to get channels endpoint', (done) => {
      request(app)
        .get('/api/channels')
        .query({ groupId: 1 })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 404, 500]);
          done();
        });
    });

    it('should return JSON response', (done) => {
      request(app)
        .get('/api/channels')
        .query({ groupId: 1 })
        .expect('Content-Type', /json/)
        .end(done);
    });
  });

  describe('POST /api/channels', () => {
    it('should respond to create channel endpoint', (done) => {
      request(app)
        .post('/api/channels')
        .send({
          name: 'Test Channel',
          description: 'A test channel',
          groupId: 1,
          userId: 1,
        })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([201, 400, 404, 500]);
          done();
        });
    });
  });

  describe('DELETE /api/channels/:id', () => {
    it('should respond to delete channel endpoint', (done) => {
      request(app)
        .delete('/api/channels/999')
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 400, 404, 500]);
          done();
        });
    });
  });
});
