using GP.Data;

namespace GP.Models.Repositories
{
    public class SkillRepository : IRepository<Skill>
    {
        public AppDbContext db { get; }
        public SkillRepository(AppDbContext _db)
        {
            db = _db;
        }
        public void Active(int Id)
        {
            var entity = Find(Id);
            entity.IsActive = !entity.IsActive;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Skill.Update(entity);
            db.SaveChanges();
        }

        public void Add(Skill entity)
        {
            entity.IsDelete = false;
            entity.IsActive = true;
            entity.CreatedId = "";
            entity.CreateDate = DateTime.Now;
            db.Skill.Add(entity);
            db.SaveChanges();
        }

        public void Delete(int Id)
        {
            var entity = Find(Id);
            entity.IsDelete = true;
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Skill.Update(entity);
            db.SaveChanges();
        }

        public Skill Find(int Id)
        {
            return db.Skill.SingleOrDefault(x => x.SkillId == Id);
        }

        public void Update(int Id, Skill entity)
        {
            entity.EditId = "";
            entity.EditDate = DateTime.Now;
            db.Skill.Update(entity);
            db.SaveChanges();
        }

        public List<Skill> ViewAdmin()
        {
            return db.Skill.Where(x => x.IsDelete == false).ToList();
        }

        public List<Skill> ViewClient()
        {
            return db.Skill.Where(x => x.IsDelete == false && x.IsActive == true).ToList();
        }
    }
}
