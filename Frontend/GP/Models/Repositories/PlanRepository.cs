using GP.Data;

namespace GP.Models.Repositories
{
    public class PlanRepository : IRepository<Plan>
    {
        public AppDbContext db { get; }
        public PlanRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Plan.Update(entity);
            db.SaveChanges();
        }

        public void Add(Plan entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Plan.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Plan.Update(entity);
            db.SaveChanges();
        }

        public Plan Find(int Id)
        {
            return db.Plan.SingleOrDefault(x => x.PlanId == Id);
        }

        public void Update(int Id, Plan entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Plan.Update(entity);
            db.SaveChanges();
        }

        public List<Plan> ViewAdmin()
        {
            return db.Plan.Where(x => x.IsDelete == false).ToList();
        }

        public List<Plan> ViewClient()
        {
            return db.Plan.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
