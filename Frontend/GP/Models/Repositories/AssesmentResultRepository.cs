
using GP.Data;

namespace GP.Models.Repositories
{
    public class AssesmentResultRepository : IRepository<AssesmentResult>
    {
        public AppDbContext db { get; }
        public AssesmentResultRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.AssesmentResult.Update(entity);
            db.SaveChanges();
        }

        public void Add(AssesmentResult entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.AssesmentResult.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.AssesmentResult.Update(entity);
            db.SaveChanges();
        }

        public AssesmentResult Find(int Id)
        {
            return db.AssesmentResult.SingleOrDefault(x => x.AssesmentResultId == Id);
        }

        public void Update(int Id, AssesmentResult entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.AssesmentResult.Update(entity);
            db.SaveChanges();
        }

        public List<AssesmentResult> ViewAdmin()
        {
            return db.AssesmentResult.Where(x => x.IsDelete == false).ToList();
        }

        public List<AssesmentResult> ViewClient()
        {
            return db.AssesmentResult.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
