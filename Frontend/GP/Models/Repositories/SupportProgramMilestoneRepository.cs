using GP.Data;

namespace GP.Models.Repositories
{
    public class SupportProgramMilestoneRepository : IRepository<SupportProgramMilestone>
    {
        public AppDbContext db { get; }
        public SupportProgramMilestoneRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SupportProgramMilestone.Update(entity);
            db.SaveChanges();
        }

        public void Add(SupportProgramMilestone entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.SupportProgramMilestone.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SupportProgramMilestone.Update(entity);
            db.SaveChanges();
        }

        public SupportProgramMilestone Find(int Id)
        {
            return db.SupportProgramMilestone.SingleOrDefault(x => x.MilestoneId == Id);
        }

        public void Update(int Id, SupportProgramMilestone entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SupportProgramMilestone.Update(entity);
            db.SaveChanges();
        }

        public List<SupportProgramMilestone> ViewAdmin()
        {
            return db.SupportProgramMilestone.Where(x => x.IsDelete == false).ToList();
        }

        public List<SupportProgramMilestone> ViewClient()
        {
            return db.SupportProgramMilestone.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
