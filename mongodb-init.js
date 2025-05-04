db = db.getSiblingDB('admin');

db.createUser({
  user: "datageek_admin",
  pwd: "DataGeek_Admin_2024",
  roles: [
    { role: "readWrite", db: "datageek" },
    { role: "dbAdmin", db: "datageek" }
  ]
});