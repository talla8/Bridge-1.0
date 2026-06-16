using GP.Data;

namespace GP.Models.Repositories
{
    public class ParentRepository : IRepository<Parent>
    {
        public AppDbContext db { get; }
        public ParentRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Parent.Update(entity);
            db.SaveChanges();
        }

        public void Add(Parent entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Parent.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Parent.Update(entity);
            db.SaveChanges();
        }

        public Parent Find(int Id)
        {
            return db.Parent.SingleOrDefault(x => x.ParentId == Id);
        }

        public void Update(int Id, Parent entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Parent.Update(entity);
            db.SaveChanges();
        }

        public List<Parent> ViewAdmin()
        {
            return db.Parent.Where(x => x.IsDelete == false).ToList();
        }

        public List<Parent> ViewClient()
        {
            return db.Parent.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
