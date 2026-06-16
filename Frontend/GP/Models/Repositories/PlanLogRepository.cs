using GP.Data;

namespace GP.Models.Repositories
{
    public class PlanLogRepository : IRepository<PlanLog>
    {
        public AppDbContext db { get; }
        public PlanLogRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.PlanLog.Update(entity);
            db.SaveChanges();
        }

        public void Add(PlanLog entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.PlanLog.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.PlanLog.Update(entity);
            db.SaveChanges();
        }

        public PlanLog Find(int Id)
        {
            return db.PlanLog.SingleOrDefault(x => x.PlanLogId == Id);
        }

        public void Update(int Id, PlanLog entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.PlanLog.Update(entity);
            db.SaveChanges();
        }

        public List<PlanLog> ViewAdmin()
        {
            return db.PlanLog.Where(x => x.IsDelete == false).ToList();
        }

        public List<PlanLog> ViewClient()
        {
            return db.PlanLog.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
