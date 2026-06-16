using GP.Data;

namespace GP.Models.Repositories
{
    public class MilestoneRepository : IRepository<Milestone>
    {
        public AppDbContext db { get; }
        public MilestoneRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Milestone.Update(entity);
            db.SaveChanges();
        }

        public void Add(Milestone entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Milestone.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Milestone.Update(entity);
            db.SaveChanges();
        }

        public Milestone Find(int Id)
        {
            return db.Milestone.SingleOrDefault(x => x.MilestoneId == Id);
        }

        public void Update(int Id, Milestone entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Milestone.Update(entity);
            db.SaveChanges();
        }

        public List<Milestone> ViewAdmin()
        {
            return db.Milestone.Where(x => x.IsDelete == false).ToList();
        }

        public List<Milestone> ViewClient()
        {
            return db.Milestone.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
