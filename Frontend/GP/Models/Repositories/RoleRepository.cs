using GP.Data;

namespace GP.Models.Repositories
{
    public class RoleRepository : IRepository<Role>
    {
        public AppDbContext db { get; }
        public RoleRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Role.Update(entity);
            db.SaveChanges();
        }

        public void Add(Role entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Role.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Role.Update(entity);
            db.SaveChanges();
        }

        public Role Find(int Id)
        {
            return db.Role.SingleOrDefault(x => x.RoleId == Id);
        }

        public void Update(int Id, Role entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Role.Update(entity);
            db.SaveChanges();
        }

        public List<Role> ViewAdmin()
        {
            return db.Role.Where(x => x.IsDelete == false).ToList();
        }

        public List<Role> ViewClient()
        {
            return db.Role.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
