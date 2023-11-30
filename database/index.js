var rps = {
  db: null,
  cache: null,
  cname: "SQLDB",
  dbname: "/rps.sqlite",
  init: async () => {
    rps.cache = await caches.open(rps.cname);
    const SQL = await initSqlJs({
      locateFile: (filename) =>
        `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.9.0/${filename}`,
    });

    rps.cache.match(rps.dbname).then(async (r) => {
      if (r == undefined) {
        rps.db = new SQL.Database();
        console.log(rps.db);
        rps.db.run(`CREATE TABLE win_statistic (
            rocks INTEGER NOT NULL,
            papers INTEGER NOT NULL,
            scissors INTEGER NOT NULL
          )`);
        rps.db.run(
          "INSERT INTO win_statistic (rocks,papers,scissors) VALUES (0,0,0)"
        );
        await rps.export();
      } else {
        const buf = await r.arrayBuffer();
        rps.db = new SQL.Database(new Uint8Array(buf));
      }
    });
  },

  get: () => {
    let stmt = rps.db.prepare(
      "SELECT *, rocks + papers + scissors as total FROM win_statistic"
    );
    stmt.step();
    return stmt.getAsObject();
  },

  update: async (column_name) => {
    rps.db.run(`UPDATE win_statistic SET ${column_name} = ${column_name} + 1`);
    await rps.export();
  },

  export: async () =>
    await rps.cache.put(rps.dbname, new Response(rps.db.export())),
};

export default rps;
