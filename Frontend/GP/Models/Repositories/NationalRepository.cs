using GP.Data;

namespace GP.Models.Repositories
{
    public class NationalRepository : IRepository<National>
    {
        public AppDbContext db { get; }
        public NationalRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.National.Update(entity);
            db.SaveChanges();
        }

        public void Add(National entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.National.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.National.Update(entity);
            db.SaveChanges();
        }

        public National Find(int Id)
        {
            return db.National.SingleOrDefault(x => x.NationalId == Id);
        }

        public void Update(int Id, National entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.National.Update(entity);
            db.SaveChanges();
        }

        public List<National> ViewAdmin()
        {
            return db.National.Where(x => x.IsDelete == false).ToList();
        }

        public List<National> ViewClient()
        {
            return db.National.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
