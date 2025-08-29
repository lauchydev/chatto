class Users {
  constructor(id, username, email, image, birthdate, age, roles, password, valid = false, banned = false, reported = false) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.image = image;
    this.birthdate = birthdate;
    this.age = age;
    this.roles = [roles];
    this.password = password;
    this.valid = valid;
    this.banned = banned;
    this.reported = reported;
  }
}

module.exports = Users;
