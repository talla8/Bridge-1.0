using GP.Data;

namespace GP.Models.Repositories
{
    public class SupportItemRepository : IRepository<SupportItem>
    {
        public AppDbContext db { get; }
        public SupportItemRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SupportItem.Update(entity);
            db.SaveChanges();
        }

        public void Add(SupportItem entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.SupportItem.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SupportItem.Update(entity);
            db.SaveChanges();
        }

        public SupportItem Find(int Id)
        {
            return db.SupportItem.SingleOrDefault(x => x.SupportItemId == Id);
        }

        public void Update(int Id, SupportItem entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SupportItem.Update(entity);
            db.SaveChanges();
        }

        public List<SupportItem> ViewAdmin()
        {
            return db.SupportItem.Where(x => x.IsDelete == false).ToList();
        }

        public List<SupportItem> ViewClient()
        {
            return db.SupportItem.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
