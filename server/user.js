class Users {
  constructor(id, username, email, birthdate, age, groups, roles, password, valid = false) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.birthdate = birthdate;
    this.age = age;
    this.groups = groups;
    this.roles = roles;
    this.password = password;
    this.valid = valid;
  }
}

module.exports = Users;
