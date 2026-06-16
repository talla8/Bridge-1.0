using GP.Data;

namespace GP.Models.Repositories
{
    public class SkillCurriculumItemRepository : IRepository<SkillCurriculumItem>
    {
        public AppDbContext db { get; }
        public SkillCurriculumItemRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SkillCurriculumItem.Update(entity);
            db.SaveChanges();
        }

        public void Add(SkillCurriculumItem entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.SkillCurriculumItem.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SkillCurriculumItem.Update(entity);
            db.SaveChanges();
        }

        public SkillCurriculumItem Find(int Id)
        {
            return db.SkillCurriculumItem.SingleOrDefault(x => x.SkillCurriculumItemId == Id);
        }

        public void Update(int Id, SkillCurriculumItem entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.SkillCurriculumItem.Update(entity);
            db.SaveChanges();
        }

        public List<SkillCurriculumItem> ViewAdmin()
        {
            return db.SkillCurriculumItem.Where(x => x.IsDelete == false).ToList();
        }

        public List<SkillCurriculumItem> ViewClient()
        {
            return db.SkillCurriculumItem.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
