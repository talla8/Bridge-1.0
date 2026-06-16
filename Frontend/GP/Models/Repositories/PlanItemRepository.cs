using GP.Data;

namespace GP.Models.Repositories
{
    public class PlanItemRepository : IRepository<PlanItem>
    {
        public AppDbContext db { get; }
        public PlanItemRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.PlanItem.Update(entity);
            db.SaveChanges();
        }

        public void Add(PlanItem entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.PlanItem.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.PlanItem.Update(entity);
            db.SaveChanges();
        }

        public PlanItem Find(int Id)
        {
            return db.PlanItem.SingleOrDefault(x => x.PlanItemId == Id);
        }

        public void Update(int Id, PlanItem entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.PlanItem.Update(entity);
            db.SaveChanges();
        }

        public List<PlanItem> ViewAdmin()
        {
            return db.PlanItem.Where(x => x.IsDelete == false).ToList();
        }

        public List<PlanItem> ViewClient()
        {
            return db.PlanItem.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
