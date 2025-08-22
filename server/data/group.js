class Groups {
  constructor(id, name, icon, owner, members, channels) {
    this.id = id;
    this.name = name;
    this.icon = icon;
    this.owner = owner;
    this.members = [members];
    this.channels = [channels];
  }
}
