declare module 'better-sqlite3' {
    class Database {
      prepare(sql: string, params?: any): Statement;
      exec(sql: string): Database;
      close(): void;
    }
  
    class Statement {
      run(params?: any): any;
      all(params?: any): any[];
      get(params?: any): any;
    }
  
    function betterSqlite3(path: string, options?: any): Database;
    export = betterSqlite3;
  }