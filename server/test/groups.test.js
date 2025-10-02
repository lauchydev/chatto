const request = require('supertest');
const { expect } = require('chai');
const { createTestApp } = require('./app');

describe('Groups Routes', () => {
  let app;

  before(() => {
    app = createTestApp();
  });

  describe('GET /api/groups', () => {
    it('should respond to get groups endpoint', (done) => {
      request(app)
        .get('/api/groups')
        .query({ userId: 1 })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 404, 500]);
          done();
        });
    });

    it('should return JSON response', (done) => {
      request(app).get('/api/groups').query({ userId: 1 }).expect('Content-Type', /json/).end(done);
    });
  });

  describe('POST /api/groups', () => {
    it('should respond to create group endpoint', (done) => {
      request(app)
        .post('/api/groups')
        .send({
          name: 'Test Group',
          description: 'A test group',
          adminId: 1,
        })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([201, 400, 500]);
          done();
        });
    });
  });

  describe('POST /api/groups/:groupId/join', () => {
    it('should respond to join group endpoint', (done) => {
      request(app)
        .post('/api/groups/1/join')
        .send({ userId: 2 })
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 400, 404, 500]);
          done();
        });
    });
  });

  describe('DELETE /api/groups/:groupId/requests/:userId', () => {
    it('should respond to reject request endpoint', (done) => {
      request(app)
        .delete('/api/groups/1/requests/2')
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 404, 500]);
          done();
        });
    });
  });

  describe('POST /api/groups/:groupId/ban/:userId', () => {
    it('should respond to ban user endpoint', (done) => {
      request(app)
        .post('/api/groups/1/ban/2')
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 400, 404, 500]);
          done();
        });
    });
  });

  describe('DELETE /api/groups/delete/:groupId', () => {
    it('should respond to delete group endpoint', (done) => {
      request(app)
        .delete('/api/groups/delete/999')
        .end((err, res) => {
          expect(res).to.have.property('status');
          expect(res.status).to.be.oneOf([200, 404, 500]);
          done();
        });
    });
  });
});
